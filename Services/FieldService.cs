using Microsoft.Extensions.Caching.Memory;
using Snake.Interfaces;
using Snake.Models;
using Snake.Models.DTO;
namespace Snake.Services
{
    public class FieldService : IFieldService
    {
        public IMemoryCache _cache;
        public ISnakeService _snakeService;
        public FieldService(IMemoryCache cache) 
        {
            _cache = cache;
        }
        public void CreateNewField(FieldDTO field)
        {
            var newField = new Field
            {
                Id = Guid.NewGuid(),
                Height = field.Height,
                Width = field.Width,
                Name = field.Name,
            };
            GenerateNewApple(newField);
        }
        public void GenerateNewApple(Field field)
        {
            var apple = new Apple
            {
                Id = Guid.NewGuid(),
                X = Random.Shared.Next(0,field.Width),
                Y = Random.Shared.Next(0,field.Height)
            };
            field.Apple = apple;
            _cache.Set($"F_{field.Id}", field);
        }

    }
}
