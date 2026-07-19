using System.Security.Cryptography;
using System.Text;
using ITHelpDesk.Api.Options;
using Microsoft.Extensions.Options;

namespace ITHelpDesk.Api.Services;

public sealed class PasswordResetCodeService : IPasswordResetCodeService
{
    private readonly byte[] _hashKey;

    public PasswordResetCodeService(
        IOptions<PasswordResetOptions> options)
    {
        _hashKey = Convert.FromBase64String(options.Value.HashKey);
    }

    public string GenerateCode()
    {
        var number = RandomNumberGenerator.GetInt32(0, 1_000_000);

        return number.ToString("D6");
    }

    public string HashCode(string code)
    {
        using var hmac = new HMACSHA256(_hashKey);

        var codeBytes = Encoding.UTF8.GetBytes(code);
        var hashBytes = hmac.ComputeHash(codeBytes);

        return Convert.ToBase64String(hashBytes);
    }

    public bool VerifyCode(string code, string storedHash)
    {
        try
        {
            var calculatedHash = HashCode(code);
            var calculatedBytes = Convert.FromBase64String(calculatedHash);
            var storedBytes = Convert.FromBase64String(storedHash);

            return CryptographicOperations.FixedTimeEquals(
                calculatedBytes,
                storedBytes);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}