const validatePassword = (password, requirements) => {
    if (password.length < requirements.minLength || password.length > requirements.maxLength) {
        return `Password must be between ${requirements.minLength} and ${requirements.maxLength} characters.`;
    }
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter.';
    }
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter.';
    }
    if (requirements.requireNumber && !/[0-9]/.test(password)) {
        return 'Password must contain at least one number.';
    }
    if (requirements.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'Password must contain at least one special character.';
    }
    return null; // Valid password
};

module.exports = validatePassword;