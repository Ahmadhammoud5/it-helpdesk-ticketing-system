using System.Security.Cryptography;
using System.Text;

namespace ITHelpDesk.Api.Services;

public static class SecurityStampFingerprint
{
    public const string ClaimType =
        "ithelpdesk:security-stamp-fingerprint";

    public static string Compute(string securityStamp)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(
            securityStamp);

        var stampBytes = Encoding.UTF8.GetBytes(
            securityStamp);

        return Convert.ToHexString(
            SHA256.HashData(stampBytes));
    }

    public static bool Matches(
        string? securityStamp,
        string? fingerprint)
    {
        if (string.IsNullOrWhiteSpace(securityStamp) ||
            string.IsNullOrWhiteSpace(fingerprint))
        {
            return false;
        }

        var expectedFingerprint = Compute(securityStamp);
        var expectedBytes = Encoding.UTF8.GetBytes(
            expectedFingerprint);
        var actualBytes = Encoding.UTF8.GetBytes(
            fingerprint);

        return CryptographicOperations.FixedTimeEquals(
            expectedBytes,
            actualBytes);
    }
}
