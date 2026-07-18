namespace ITHelpDesk.Api.Services;

public interface IPasswordResetCodeService
{
    string GenerateCode();

    string HashCode(string code);

    bool VerifyCode(string code, string storedHash);
}