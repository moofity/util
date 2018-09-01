'use strict';

/**
 * ABSTRACT CLASSES
 */

class AuthError extends Error {

    constructor(name, message) {
        super(name, message);
        this.type = 'auth-error';
    }

    toJSON() {
        return JSON.stringify({
            name: this.name,
            message: this.message,
            type: this.type
        });
    }

    static get type() {
        return 'auth-error';
    }

}

class LoginError extends AuthError {
    constructor(name, message) {
        name = name || 'login-error';
        message = message || 'There was an error in the login process.';
        super(name, message);
        this.type = 'login-error';
    }

    static get type() {
        return 'login-error';
    }
}

/**
 * SUBCLASSES
 */

class InvalidCaptchaError extends AuthError {
    constructor() { super('invalid-captcha', 'The captcha the user entered is invalid'); }
}

class InvalidEmailFormatError extends AuthError {
    constructor() { super('invalid-email-format', 'The email format is not sufficient'); }
}

class InvalidPasswordFormatError extends AuthError {
    constructor() { super('invalid-password-format', 'The password format is not sufficient'); }
}

class EmailInUseError extends AuthError {
    constructor() { super('email-in-use', 'The email the user entered already exists'); }
}

class InvalidTokenError extends AuthError {
    constructor() { super('invalid-token', 'The token is invalid'); }
}

class TokenExpiredError extends AuthError {
    constructor() { super('token-expired', 'Email verification token has expired'); }
}

class InvalidCredentialsError extends AuthError {
    constructor() { super('invalid-credentials', 'The provided credentials are invalid'); }
}

class InvalidTotpMatchError extends AuthError {
    constructor() { super('invalid-totp-match', 'The provided totp codes do not match'); }
}

// These login subclassed errors shoudn't be exposed to the user but used internally for logging.
// We should only expose LoginError to the user! Reason: security considerations

class InvalidUserError extends LoginError {
    constructor() { super('invalid-user', 'The user does not exist.'); }
}

class NotVerifiedUserError extends LoginError {
    constructor() { super('not-verified-user', 'The user account has not been verified yet.'); }
}

class InvitedUserError extends LoginError {
    constructor() { super('invited-user', 'The invited user account has not been verified yet.'); }
}

class InvitedVerifiedUserError extends LoginError {
    constructor() { super('invited-verified-user', 'Invalid user status upon login -> invited-verified'); }
}

class InvalidPasswordError extends LoginError {
    constructor() { super('invalid-password', 'The password did not match with the hash.'); }
}

class UnauthorizedError extends AuthError {
    constructor() { super('unauthorized', 'You are not authorized to access this resource'); }
}

module.exports = {
    AuthError,
    InvalidCaptchaError,
    InvalidEmailFormatError,
    InvalidPasswordFormatError,
    EmailInUseError,
    InvalidTokenError,
    TokenExpiredError,
    LoginError,
    InvalidCredentialsError,
    InvalidTotpMatchError,
    InvalidUserError,
    NotVerifiedUserError,
    InvitedUserError,
    InvitedVerifiedUserError,
    InvalidPasswordError,
    UnauthorizedError
};
