const Joi = require("joi");

class AuthValidator {

    register(data) {
        const schema = Joi.object({
            username: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        });

        return schema.validate(data);
    }

    verifyOtp(data) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            otp: Joi.string().length(6).required()
        });

        return schema.validate(data);
    }

    login(data) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        });

        return schema.validate(data);
    }

    forgotPassword(data) {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });

        return schema.validate(data);
    }

    resetPassword(data) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            otp: Joi.string().length(6).required(),
            newPassword: Joi.string().min(6).required()
        });

        return schema.validate(data);
    }
}

module.exports = new AuthValidator();
