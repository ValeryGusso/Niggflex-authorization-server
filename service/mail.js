import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: false,
			service: 'gmail',
			auth: {
				user: process.env.MAIL_LOGIN,
				pass: process.env.MAIL_SECURE_PASS,
			},
		})
	}
	async sendCode(to, key) {
		try {
			await this.transporter.sendMail(
				{
					from: process.env.MAIL_LOGIN,
					to,
					subject:
						'Активация аккаунта на Niggflex. Лучшем в мире сервисе о кино. Niggflex - всё, что ты любишь, но немного темнее!',
					text: '',
					html: `<div>
                <h1>${key}</h1>
               </div>`,
				},
				err => {
					if (err) {
						return { sended: false, err }
					}
				}
			)
			return { sended: true }
		} catch (err) {
			return { sended: false, err }
		}
	}
}

export default new MailService()
