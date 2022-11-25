import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			unique: true,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		name: { type: String, default: 'Unnamed user' },
		isActivated: { type: Boolean, default: false },
		sex: { type: String, default: 'man' },
		avatar: { type: String, default: '' },
		key: Number,
		favorite: [Number],
		viewed: [Number],
	},
	{
		timestamps: true,
	}
)

export default mongoose.model('User', userSchema)
