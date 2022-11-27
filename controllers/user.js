import UserService from '../service/user.js'
import TokenService from '../service/token.js'
import UserModel from '../models/user.js'
import { validationResult } from 'express-validator'
import UserDTO from '../user-dto.js'

export async function registration(req, res) {
	try {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			return res.status(400).json(errors.array())
		}

		const { email, password } = req.body
		const user = await UserService.registration(email, password)
		res.cookie('refreshToken', user.refresh, {
			maxAge: 30 * 24 * 3600 * 1000,
			httpOnly: true,
			secure: false,
			SameSite: 'none',
			sameSite: 'none',
		})

		return res.json(user)
	} catch (err) {
		if (err.message === 'Пользователь с таким адресом уже существует') {
			return res.status(409).json({ msg: err.message })
		}
		return res.status(500).json({ msg: err.message })
	}
}

export async function activate(req, res) {
	try {
		const { id, key } = req.body
		const { user, tokens } = await UserService.activate(id, key)
		res.cookie('refreshToken', tokens.refresh, { maxAge: 30 * 24 * 3600 * 1000, httpOnly: true, secure: false })
		return res.json({ user, access: tokens.access })
	} catch (err) {
		return res.status(500).json({ message: err.message })
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body
		const { user, tokens } = await UserService.login(email, password)
		res.cookie('refreshToken', tokens.refresh, {
			maxAge: 30 * 24 * 3600 * 1000,
			httpOnly: true,
			secure: true,
			SameSite: 'none',
			sameSite: 'none',
		})
		res.cookie('test', 'Test text', {
			maxAge: 30 * 24 * 3600 * 1000,
			httpOnly: false,
			secure: true,
			SameSite: 'none',
			sameSite: 'none',
		})
		res.cookie('test2', 'Test2 text')

		return res.json({ user, access: tokens.access })
	} catch (err) {
		res.status(501).json({ message: err.message })
	}
}

export async function logout(req, res) {
	try {
		const { refreshToken } = req.cookies

		const success = await UserService.logout(refreshToken)

		res.clearCookie('refreshToken')
		res.clearCookie('test')
		res.clearCookie('test2')
		return res.json(success)
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message })
	}
}

export async function refresh(req, res) {
	try {
		const { refreshToken } = req.cookies

		const { user, access, refresh } = await TokenService.refresh(refreshToken)
		res.cookie('refreshToken', refresh, {
			maxAge: 30 * 24 * 3600 * 1000,
			httpOnly: true,
			secure: true,
			SameSite: 'none',
			sameSite: 'none',
		})

		return res.json({ user, access })
	} catch (err) {
		res.status(401).json({ success: false, message: err.message })
	}
}

export async function checkAuth(req, res, next) {
	try {
		const token = req.headers.authorization.replace(/Bearer\s?/, '')

		if (!token) {
			return res.status(401).json({ message: 'Пользователь не авторизован' })
		}

		const verify = await TokenService.verifyAccess(token)

		if (!verify) {
			return res.status(401).json({ message: 'Пользователь не авторизован' })
		}

		req.user = verify
		next()
	} catch (err) {
		return res.status(401).json({ message: 'Пользователь не авторизован111' })
	}
}

export async function getMe(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)
		const userDTO = new UserDTO(user)
		return res.json({ ...userDTO })
	} catch (err) {
		return res.status(401).json({ message: 'Пользователь не авторизован' })
	}
}

export async function addFavorite(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		if (!user.favorite.includes(req.body.id)) {
			user.favorite.push(req.body.id)

			await user.save()

			const userDTO = new UserDTO(user)

			return res.json({ user: userDTO })
		} else {
			res.status(500).json({ message: 'Позиция уже существует' })
		}
	} catch (err) {
		res.status(500).json({ message: 'Не удалось добавить в список избранного' })
	}
}

export async function addViewed(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		if (!user.viewed.includes(req.body.id)) {
			user.viewed.push(req.body.id)

			await user.save()

			const userDTO = new UserDTO(user)

			return res.json({ user: userDTO })
		} else {
			res.status(500).json({ message: 'Позиция уже существует' })
		}
	} catch (err) {
		res.status(500).json({ message: 'Не удалось добавить в список просмотренного' })
	}
}

export async function removeFavorite(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		if (user.favorite.includes(req.body.id)) {
			const filtred = user.favorite.filter(el => el !== req.body.id)
			user.favorite = filtred

			await user.save()

			const userDTO = new UserDTO(user)

			return res.json({ user: userDTO })
		} else {
			res.status(500).json({ message: 'Позиция не существует' })
		}
	} catch (err) {
		res.status(500).json({ message: 'Не удалось удалить из списка избранного' })
	}
}

export async function removeViewed(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		if (user.viewed.includes(req.body.id)) {
			const filtred = user.viewed.filter(el => el !== req.body.id)
			user.viewed = filtred

			await user.save()

			const userDTO = new UserDTO(user)

			return res.json({ user: userDTO })
		} else {
			res.status(500).json({ message: 'Позиция не существует' })
		}
	} catch (err) {
		res.status(500).json({ message: 'Не удалось удалить из списка просмотренного' })
	}
}

export async function update(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)
		const { name, sex, avatar } = req.body
		console.log(name, sex, avatar)

		if (name && name !== user.name) {
			user.name = name
		}

		if (sex && sex !== user.sex) {
			user.sex = sex
		}

		if (avatar && avatar !== user.avatar) {
			user.avatar = avatar
		}

		await user.save()
		const userDTO = new UserDTO(user)
		return res.json({ user: userDTO })
	} catch (err) {
		return res.status(500).json({ message: 'Не удалось обновить информацию' })
	}
}
