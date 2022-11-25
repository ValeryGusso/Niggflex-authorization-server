import { body } from 'express-validator'

export const regValidation = [
	body('email', 'Некорректный формат почты').isEmail(),
	body('password', 'Пароль не может быть короче 5 символов').isLength({ min: 5 }),
]