using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Snake.Hubs;
using Snake.Interfaces;
using Snake.Models;
using Snake.Models.DTO;
namespace Snake.Services
{
    public class FieldService : IFieldService
    {
        public IMemoryCache _cache;
        IHubContext<SnakeHub> _hubContext;
        public ISnakeService _snakeService;
        public FieldService(IMemoryCache cache, IHubContext<SnakeHub> hubContext)
        {
            _cache = cache;
            _hubContext = hubContext;
        }
        public Guid CreateNewField(FieldDTO field)
        {
            var newField = new Field
            {
                Id = Guid.NewGuid(),
                Height = field.Height,
                Width = field.Width,
                Name = field.Name,
            };
            GenerateNewApple(newField);
            _cache.Set($"F_{newField.Id}", newField);

            Console.WriteLine($"Created field: {newField.Id}, Size: {newField.Width}x{newField.Height}");

            return newField.Id;
        }
        public async Task GenerateNewApple(Field field)
        {
            var apple = new Apple
            {
                Id = Guid.NewGuid(),
                X = Random.Shared.Next(0, field.Width),
                Y = Random.Shared.Next(0, field.Height)
            };
            field.Apple = apple;
            _cache.Set($"F_{field.Id}", field);
            await _hubContext.Clients.Group(field.Id.ToString()).SendAsync("UpdateApplePosition", field.Apple);
        }

    }
}
