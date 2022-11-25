export default class UserDTO {
	constructor(user) {
		this.id = user._id
		this.email = user.email
		this.name = user.name
		this.sex = user.sex
		this.avatar = user.avatar
		this.isActivated = user.isActivated
		this.favorite = user.favorite
		this.viewed = user.viewed
	}
}
