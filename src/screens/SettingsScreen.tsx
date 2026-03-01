import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView, StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { supabase } from '../lib/supabase';
import { useHabitStore } from '../store/habitStore';
import { useThemeStore } from '../store/themeStore';
import { cancelGlobalReminder, requestPermissions, scheduleGlobalReminder } from '../utils/notifications';


type SettingRowProps = {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  colors: any;
};

function SettingRow({ icon, label, subtitle, onPress, right, danger, colors }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <View>
          <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
          {subtitle && <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
        </View>
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
      {onPress && !right && <Text style={[styles.rowArrow, { color: colors.textMuted }]}>›</Text>}
    </TouchableOpacity>
  );
}

const HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '18:00', '20:00', '21:00'];

export default function SettingsScreen() {
  const colors = useColors();
  const { habits, clearAllHabits, resetStore, importHabitsFromBackup } = useHabitStore();
  const { themeMode, setThemeMode, loadTheme } = useThemeStore();
  const [notifications, setNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const { userName, setUserName, userMotivation, appStartDate, setUserMotivation } = useThemeStore();
  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(userName);

  useEffect(() => {
    setTempName(userName);
  }, [userName]);

  useEffect(() => {
    const loadPrefs = async () => {
      const notif = await AsyncStorage.getItem('notifications_enabled');
      const time = await AsyncStorage.getItem('reminder_time');
      setNotifications(notif === 'true');
      if (time) setReminderTime(time);
    };
    loadPrefs();
  }, []);

  const handleEditName = () => {
    setTempName(userName);
    setNameModalVisible(true);
  };

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await setUserName(tempName.trim());
    }
    setNameModalVisible(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión? Los cambios no sincronizados podrían perderse.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            await resetStore();
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Borrar todos los datos',
      'Esto eliminará todos tus hábitos y progreso. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar todo', style: 'destructive', onPress: () => clearAllHabits() }
      ]
    );
  };

  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem('onboarding_completed');
    Alert.alert('✅ Listo', 'Cierra y vuelve a abrir la app para ver el onboarding.');
  };

  // Guardamos la preferencia inmediatamente para no perder el cambio al cerrar la app.
  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Activa las notificaciones para usar recordatorios.');
        return;
      }
      const [hour, minute] = reminderTime.split(':').map(Number);
      await scheduleGlobalReminder(hour, minute);
    } else {
      await cancelGlobalReminder();
    }

    setNotifications(value);
    await AsyncStorage.setItem('notifications_enabled', String(value));
  };

  // La hora seleccionada también se persiste para mantener consistencia entre sesiones.
  const handleSelectReminderTime = async (time: string) => {
    setReminderTime(time);
    setShowTimePicker(false);
    await AsyncStorage.setItem('reminder_time', time);

    // Si las notificaciones globales están activas, reprogramamos con la nueva hora.
    if (notifications) {
      const [hour, minute] = time.split(':').map(Number);
      await scheduleGlobalReminder(hour, minute);
    }
  };

  const handleExportBackup = async () => {
    try {
      const backup = {
        exportedAt: new Date().toISOString(),
        app: 'Habit Tracker',
        version: '1.0.0',
        user: {
          name: userName,
          motivation: userMotivation,
          appStartDate,
          themeMode,
        },
        settings: {
          notificationsEnabled: notifications,
          reminderTime,
        },
        habits,
      };

      const fileUri = `${FileSystem.cacheDirectory}habit-tracker-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Backup creado', `Archivo generado en:\n${fileUri}`);
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar backup de Habit Tracker',
      });
    } catch (error) {
      console.error('Error exporting backup:', error);
      Alert.alert('Error', 'No se pudo exportar el backup.');
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const picked = result.assets?.[0];
      if (!picked?.uri) {
        Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
        return;
      }

      const raw = await FileSystem.readAsStringAsync(picked.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = JSON.parse(raw);

      if (!parsed || !Array.isArray(parsed.habits)) {
        Alert.alert('Error', 'El archivo no tiene un formato de backup válido.');
        return;
      }

      await importHabitsFromBackup(parsed.habits);

      if (parsed.user?.name) {
        await setUserName(String(parsed.user.name));
      }
      if (typeof parsed.user?.motivation === 'string') {
        await setUserMotivation(parsed.user.motivation);
      }
      if (parsed.user?.themeMode) {
        await setThemeMode(parsed.user.themeMode);
      }
      if (parsed.user?.appStartDate) {
        await AsyncStorage.setItem('app_start_date', String(parsed.user.appStartDate));
      }

      if (typeof parsed.settings?.notificationsEnabled === 'boolean') {
        await AsyncStorage.setItem('notifications_enabled', String(parsed.settings.notificationsEnabled));
        setNotifications(parsed.settings.notificationsEnabled);
      }
      if (typeof parsed.settings?.reminderTime === 'string') {
        await AsyncStorage.setItem('reminder_time', parsed.settings.reminderTime);
        setReminderTime(parsed.settings.reminderTime);
      }

      await loadTheme();

      Alert.alert('Backup importado', 'Tus datos fueron restaurados correctamente.');
    } catch (error) {
      console.error('Error importing backup:', error);
      Alert.alert('Error', 'No se pudo importar el backup.');
    }
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ← Modal para editar nombre */}
        <Modal
          visible={nameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setNameModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                👤 Tu nombre
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Así aparecerás en el saludo
              </Text>
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.primary,
                  color: colors.text,
                }]}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Tu nombre..."
                placeholderTextColor={colors.textMuted}
                maxLength={20}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => setNameModalVisible(false)}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textMuted }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveName}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Configuración</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Personaliza tu experiencia</Text>
        </View>

        {/* Perfil */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
          <Text style={styles.profileAvatar}>🧠</Text>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>Mi progreso</Text>
            <Text style={[styles.profileStat, { color: colors.textMuted }]}>
              {totalHabits} hábitos · {totalCompletions} completados en total
            </Text>
          </View>
        </View>

        {/* Preferencias */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Preferencias</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="🌙"
            label="Tema de la aplicación"
            subtitle={themeMode === 'system' ? 'Sistema' : themeMode === 'dark' ? 'Oscuro' : 'Claro'}
            colors={colors}
            onPress={() => setShowThemePicker(!showThemePicker)}
          />
          {showThemePicker && (
            <View style={styles.timePicker}>
              {[
                { label: 'Sistema', value: 'system' },
                { label: 'Oscuro', value: 'dark' },
                { label: 'Claro', value: 'light' }
              ].map((themeOpt) => (
                <TouchableOpacity
                  key={themeOpt.value}
                  style={[styles.timeBtn, { backgroundColor: colors.border },
                  themeMode === themeOpt.value && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
                  onPress={() => { setThemeMode(themeOpt.value as any); setShowThemePicker(false); }}
                >
                  <Text style={[styles.timeText, { color: themeMode === themeOpt.value ? colors.primary : colors.textMuted }]}>
                    {themeOpt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="👤"
            label="Tu nombre"
            subtitle={userName || 'Sin nombre'}
            colors={colors}
            onPress={handleEditName}
          />
          <SettingRow
            icon="🔔"
            label="Notificaciones"
            subtitle="Disponible en build APK"
            colors={colors}
            right={
              <Switch
                value={notifications}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="⏰"
            label="Hora del recordatorio"
            subtitle={reminderTime}
            colors={colors}
            onPress={() => setShowTimePicker(!showTimePicker)}
          />
          {showTimePicker && (
            <View style={styles.timePicker}>
              {HOURS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeBtn, { backgroundColor: colors.border },
                  reminderTime === time && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
                  onPress={() => { handleSelectReminderTime(time); }}
                >
                  <Text style={[styles.timeText, { color: reminderTime === time ? colors.primary : colors.textMuted }]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Acerca de */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Acerca de la app</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="📱" label="Versión" subtitle="Habit Tracker v1.0.0" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="⭐" label="Calificar la app" colors={colors}
            onPress={() => Alert.alert('¡Gracias!', 'Pronto estará disponible en la tienda.')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="🔒" label="Política de privacidad" colors={colors}
            onPress={() => Alert.alert('Privacidad', 'Tus datos se guardan localmente y, si inicias sesión, también se sincronizan con tu cuenta en la nube (Supabase).')}
          />
        </View>

        {/* Datos */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Datos y Cuenta</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="🔄" label="Resetear onboarding"
            subtitle="Solo para desarrollo" colors={colors}
            onPress={handleResetOnboarding}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="💾" label="Exportar backup"
            subtitle="Genera un archivo JSON con tus datos"
            colors={colors} onPress={handleExportBackup}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="📥" label="Importar backup"
            subtitle="Restaura hábitos y preferencias desde JSON"
            colors={colors} onPress={handleImportBackup}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="🚪" label="Cerrar sesión"
            colors={colors} onPress={handleSignOut}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="🗑️" label="Borrar todos los datos"
            danger colors={colors} onPress={handleClearData}
          />
        </View>

        <View style={styles.footerContainer}>
          <View style={[styles.footerDivider, { backgroundColor: colors.primary + '44' }]} />
          <Text style={[styles.footerEmoji]}>💜</Text>
          <Text style={[styles.footerText, { color: colors.text }]}>
            Hecho por <Text style={{ color: colors.primary, fontWeight: 'bold' }}>José Pérez</Text>
          </Text>
          <Text style={[styles.footerSub, { color: colors.textMuted }]}>
            Habit Tracker · 2026
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, padding: 20, margin: 20, marginTop: 16, borderWidth: 1,
  },
  profileAvatar: { fontSize: 44, marginRight: 16 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  profileStat: { fontSize: 13 },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: 20, marginBottom: 8, marginTop: 8,
  },
  card: { borderRadius: 20, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { fontSize: 22, marginRight: 14 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowRight: { marginLeft: 12 },
  rowArrow: { fontSize: 22 },
  divider: { height: 1, marginLeft: 52 },
  timePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, paddingTop: 0 },
  timeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  timeText: { fontSize: 14 },
  footerContainer: {
    alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20,
  },
  footerDivider: {
    width: 60, height: 3, borderRadius: 2, marginBottom: 20,
  },
  footerEmoji: { fontSize: 32, marginBottom: 8 },
  footerText: { fontSize: 16, marginBottom: 4 },
  footerSub: { fontSize: 13 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', borderRadius: 24, padding: 24, borderWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  modalInput: {
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, borderWidth: 2, marginBottom: 20, textAlign: 'center',
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
