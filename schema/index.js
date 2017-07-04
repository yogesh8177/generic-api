'use strict';

module.exports = function(app, mongoose) {
    require('./userSchema')(app, mongoose);
};