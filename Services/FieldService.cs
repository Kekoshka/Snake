using Microsoft.Extensions.Caching.Memory;
using Snake.Interfaces;
using Snake.Models;
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
        public void CreateNewField(string name, int height, int width)
        {
            var newField = new Field
            {
                Id = Guid.NewGuid(),
                Height = height,
                Width = width,
                Name = name,
            };
            GenerateNewApple(newField);
            _cache.Set($"F_{newField.Id}", newField);
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
        public void AddSnakeToField(int fieldId, string snakeName)
        {
            var field = _cache.Get<Field>($"F_{fieldId}");
            if(field is not null)
                field.Snakes.Add(_snakeService.CreateSnake(snakeName, field));
        }
    }
}
