import multer from 'multer'
import fs from 'fs'

const storage = multer.diskStorage({
	destination: (_, __, callback) => {
		// if (!fs.existsSync('./uploads')) {
		// 	fs.mkdirSync('./uploads')
		// }
		callback(null, './uploads')
	},
	filename: (_, file, callback) => {
		callback(null, file.originalname)
	},
})

const upload = multer({ storage })

export async function uploadMiddleware(req, res, next) {
	await new Promise((resolve, reject) => {
		upload.single('image')(req, res, err => {
			if (err instanceof multer.MulterError) {
				reject(err)
			} else {
				resolve()
			}
		})
	})
	next()
}
