'use strict';

module.exports = function(app, mongoose) {
    var userSchema = new mongoose.Schema({
            name: String,
            email: String,
            mobile: Number,
            createdAt: { type: Date, default : Date.now() }
        });

    //Pre save function for updatedAt

    userSchema.plugin(require('./plugins/pagedFind'));
    userSchema.index({ _id: 1 });
    userSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.User = mongoose.model('User', userSchema);

};

