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
						'Активация аккаунта на Niggflex.',
					text: '',
					html: `<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: #212325; text-align: center;"
				>
					<img
						style="width: 45%"
						src="https://cdn.discordapp.com/attachments/410547970505703436/1045749764555292752/logo.png"
						alt="image"
					/>
					<h1 style="color: #ededed; padding: 15px 30px; border: 2px solid #ededed; border-radius: 15px">${key}</h1>
					<h2 style="color: #ededed; padding: 15px 30px">
						Это твой код для активации аккаунта на <span style="color: #E50914; font-style: italic">Niggflex</span> - лучшем в мире сайте о кино! <br />
						<span style="color: #E50914; font-style: italic">Niggflex</span> - всё, что ты любишь, но немного темнее!
					</h2>
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
