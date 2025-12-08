class Email {
    constructor(value) {
        if (!value || !value.includes("@")) {
            throw new Error("Invalid email address");
        }
        this.value = value;
    }
}

module.exports = Email;
