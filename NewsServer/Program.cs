using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NewsServer.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];

// Add JWT authentication to the application
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Set token validation parameters
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, // Ensure the token was issued by a trusted authority
            ValidateAudience = true, // Ensure the token is intended for this application
            ValidateLifetime = true, // Ensure the token hasn't expired
            ValidateIssuerSigningKey = true, // Ensure the signing key is valid and trusted
            ValidIssuer = issuer, // The expected issuer (must match the "iss" claim in token)
            ValidAudience = audience, // The expected audience (must match the "aud" claim in token)
            // The key used to sign and validate the token's signature
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            // Eliminate default clock skew (5 minutes), making token expiration exact
            ClockSkew = TimeSpan.Zero
        };
    });

// Register authorization services for handling role-based access control
builder.Services.AddAuthorization();

// Register the JWT service so it can be injected into controllers and services
builder.Services.AddScoped<IJwtService, JwtService>();

// Add Swagger/OpenAPI documentation generation with JWT security support
builder.Services.AddSwaggerGen(c =>
{
    // Define how the JWT token should be passed in requests
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    });
    // Require the defined Bearer security scheme for accessing endpoints in Swagger
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    new string[] {}
            }
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (true)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// This checks incoming requests for a valid authentication token (e.g., JWT)
// and sets HttpContext.User if authenticated
app.UseAuthentication();

app.UseAuthorization();

app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());

app.MapControllers();

app.Run();