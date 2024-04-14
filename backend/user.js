const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const user = mongoose.model('User', userSchema);

module.export = user;