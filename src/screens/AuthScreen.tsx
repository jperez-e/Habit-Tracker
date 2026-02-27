import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useColors } from '../hooks/useColors';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
    const colors = useColors();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        if (!username.trim()) {
            return Alert.alert('Error', 'Por favor ingresa un nombre de usuario');
        }
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                },
            },
        });

        if (error) Alert.alert('Error', error.message);
        if (!session && !error) Alert.alert('Cuenta creada', 'Por favor revisa tu correo para verificar tu cuenta.');
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>🌱</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Habit Tracker</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        {isSignUp ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {isSignUp && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Nombre de usuario</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                onChangeText={(text) => setUsername(text)}
                                value={username}
                                placeholder="JuanPerez"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize={'none'}
                            />
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            onChangeText={(text) => setEmail(text)}
                            value={email}
                            placeholder="email@example.com"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize={'none'}
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Contraseña</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            onChangeText={(text) => setPassword(text)}
                            value={password}
                            secureTextEntry={true}
                            placeholder="••••••••"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize={'none'}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        disabled={loading}
                        onPress={() => (isSignUp ? signUpWithEmail() : signInWithEmail())}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>{isSignUp ? 'Registrarse' : 'Iniciar Sesión'}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.toggleContainer}
                    onPress={() => setIsSignUp(!isSignUp)}
                >
                    <Text style={[styles.toggleText, { color: colors.textMuted }]}>
                        {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                            {isSignUp ? 'Inicia sesión' : 'Regístrate'}
                        </Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
    },
    card: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    button: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    toggleContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 15,
    },
});
