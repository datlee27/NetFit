using FitnessTrainingSystem.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using System.Threading.Tasks;
using System;

namespace FitnessTrainingSystem.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var user = _configuration["SMTP_USER"]?.Trim();
        var pass = _configuration["SMTP_PASS"]?.Replace(" ", "").Trim();

        // In development, just log the email content instead of sending
        if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
        {
            _logger.LogInformation($"[DEV] Email to {toEmail}: Subject='{subject}', Body preview='{body[..Math.Min(body.Length, 200)]}'");
            return;
        }

        try
        {
            var host = _configuration["SMTP_HOST"] ?? "smtp.gmail.com";
            var port = int.TryParse(_configuration["SMTP_PORT"], out int p) ? p : 587;
            var from = _configuration["SMTP_FROM"] ?? "NETFIT <hoanglan1912a@gmail.com>";
            var enableSsl = bool.TryParse(_configuration["SMTP_ENABLE_SSL"], out bool ssl) ? ssl : true;

            var email = new MimeMessage();
            
            // Parse "Name <email@address.com>"
            var fromAddress = user ?? "hoanglan1912a@gmail.com";
            var fromName = "NETFIT";
            if (from.Contains("<") && from.Contains(">"))
            {
                var parts = from.Split('<');
                fromName = parts[0].Trim();
                var parsedAddr = parts[1].TrimEnd('>', ' ', '"');
                if (!string.IsNullOrWhiteSpace(parsedAddr))
                {
                    fromAddress = parsedAddr;
                }
            }
            
            email.From.Add(new MailboxAddress(fromName, fromAddress));
            email.To.Add(new MailboxAddress("", toEmail));
            email.Subject = subject;

            var builder = new BodyBuilder
            {
                HtmlBody = body
            };

            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            smtp.Timeout = 15000; // 15s
            smtp.ServerCertificateValidationCallback = (s, c, ch, e) => true;
            
            var socketOptions = port switch
            {
                465 => SecureSocketOptions.SslOnConnect,
                587 => SecureSocketOptions.StartTls,
                _ => enableSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None
            };

            await smtp.ConnectAsync(host, port, socketOptions);

            if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            {
                await smtp.AuthenticateAsync(user, pass);
            }
            
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
            
            _logger.LogInformation($"Successfully sent email to {toEmail} with subject: {subject}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send email to {toEmail}");
            throw;
        }
    }
}
