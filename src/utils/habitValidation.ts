import { z } from 'zod';

export const habitSchema = z.object({
    name: z.string().trim().min(1, 'El nombre no puede estar vacío').max(50, 'El nombre es muy largo'),
    icon: z.string().min(1, 'Debes seleccionar un ícono'),
    color: z.string().min(1, 'Debes seleccionar un color'),
    notes: z.string().max(200, 'Las notas no pueden superar 200 caracteres').optional(),
});
