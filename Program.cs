using Snake.Hubs;
using Snake.Interfaces;
using Snake.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();
builder.Services.AddSignalR();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IFieldService, FieldService>();
builder.Services.AddSingleton<ISnakeService, SnakeService>();
builder.Services.AddSingleton<ISnakePositionSerice, SnakePositionSerice>();
builder.Services.AddHostedService<SnakeDriverService>();


var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseStaticFiles();
app.MapHub<SnakeHub>("/snakeHub");
app.UseDefaultFiles();
app.MapFallbackToFile("index.html");
app.UseHttpsRedirection();
app.MapControllers();
app.Run();
