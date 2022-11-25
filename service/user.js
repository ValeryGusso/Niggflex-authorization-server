import UserModel from '../models/user.js'
import UserDTO from '../user-dto.js'
import MailService from './mail.js'
import TokenService from './token.js'
import bcrypt from 'bcrypt'

class UserService {
	async registration(email, password) {
		const check = await UserModel.findOne({ email })

		if (check) {
			if (check.isActivated) {
				throw new Error('Пользователь с таким адресом уже существует')
			} else {
				await check.delete()
			}
		}

		const salt = await bcrypt.genSalt(12)
		const passHash = await bcrypt.hash(password, salt)

		const key = Math.floor(Math.random() * (1_000_000 - 100_000) + 100_000)

		const user = await UserModel.create({ email, password: passHash, key })
		const { sended } = await MailService.sendCode(email, key)

		if (!sended) {
			throw new Error('Не удалось отправить письмо с кодом активации. Пожалуйста, попробуйте повторить попытку позже')
		}

		return {
			id: user._id,
			sended,
		}
	}

	async activate(id, key) {
		const user = await UserModel.findById(id)

		if (!user) {
			throw new Error('Пользователь не найден')
		}

		if (user.key === +key) {
			const userDTO = new UserDTO(user)
			const tokens = await TokenService.createTokens({ ...userDTO })
			await TokenService.save(user._id, tokens.refresh)
			user.isActivated = true
			user.key = null
			userDTO.isActivated = true
			userDTO.key = null
			await user.save()
			return { user: userDTO, tokens }
		}

		throw new Error('Ошибочка вышла! Код не подходит...')
	}

	async login(email, pass) {
		const user = await UserModel.findOne({ email })

		if (!user) {
			throw new Error('Пользователь не существует')
		}

		if (!user.isActivated) {
			throw new Error('Пользователь не активирован')
		}

		const isEqual = await bcrypt.compare(pass, user.password)

		if (isEqual) {
			const userDTO = new UserDTO(user)
			const tokens = await TokenService.createTokens({ ...userDTO })
			await TokenService.save(user._id, tokens.refresh)
			return { user: userDTO, tokens }
		} else {
			throw new Error('Неверный пароль')
		}
	}

	async logout(token) {
		const success = await TokenService.removeToken(token)
		return success
	}
}

export default new UserService()
