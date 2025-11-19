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
                Apple = GenerateNewApple(height,width)
            };

        }
        public Apple GenerateNewApple(int fieldHeight, int fieldWidth)
        {
            var apple = new Apple
            {
                Id = Guid.NewGuid(),
                X = Random.Shared.Next(0,fieldWidth),
                Y = Random.Shared.Next(0,fieldHeight)
            };
            return apple;
        }
        public void AddSnakeToField(int fieldId, string snakeName)
        {
            var field = _cache.Get<Field>($"F_{fieldId}");
            if(field is not null)
                field.Snakes.Add(_snakeService.CreateSnake(snakeName, field));
        }
    }
}
