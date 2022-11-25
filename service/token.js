import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import UserDTO from '../user-dto.js'
import TokenModel from '../models/token.js'
import UserModel from '../models/user.js'

dotenv.config()

class TokenService {
	async createTokens(payload) {
		const access = jwt.sign(payload, process.env.ACCES_KEY, { expiresIn: '1h' })
		const refresh = jwt.sign({ id: payload.id }, process.env.REFRESH_KEY, { expiresIn: '30d' })
		return { access, refresh }
	}

	async save(id, token) {
		const data = await TokenModel.findOne({ user: id })
		if (data) {
			data.refreshToken = token
			return data.save()
		}

		const newToken = await TokenModel.create({ user: id, refreshToken: token })
		return newToken
	}

	async removeToken(token) {
		const check = await TokenModel.findOneAndDelete({ refreshToken: token })

		if (check) {
			return { success: true }
		} else {
			throw new Error('Токен не найден')
		}
	}

	async refresh(token) {
		if (!token) {
			throw new Error('Нет токена авторизации')
		}
		const data = await this.verifyRefresh(token)

		if (!data) {
			throw new Error('Ошибка при валидации токена')
		}

		const oldToken = await TokenModel.findOne({ refreshToken: token })

		if (!oldToken) {
			throw new Error('Токен отсутствует в базе')
		}

		const user = await UserModel.findById(data.id)
		const userDTO = new UserDTO(user)
		const tokens = await this.createTokens({ ...userDTO })

		await this.save(user._id, tokens.refresh)
		return { ...tokens, user: userDTO }
	}

	async verifyRefresh(token) {
		try {
			const data = jwt.verify(token, process.env.REFRESH_KEY)
			return data
		} catch (err) {
			return null
		}
	}

	async verifyAccess(token) {
		try {
			const data = jwt.verify(token, process.env.ACCES_KEY)
			return data
		} catch (err) {
			return null
		}
	}
}

export default new TokenService()
