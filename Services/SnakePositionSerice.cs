using Microsoft.Extensions.Caching.Memory;
using Snake.Extensions;
using Snake.Interfaces;
using Snake.Models.DTO;

namespace Snake.Services
{
    public class SnakePositionSerice : ISnakePositionSerice
    {
        IMemoryCache _cache;
        public SnakePositionSerice(IMemoryCache cache)
        {
            _cache = cache;
        }
        public List<SnakePositionDTO> GetAllSnakePositions(Guid fieldId)
        {
            List<SnakePositionDTO> snakesPositions = new();
            var fieldSnakes = _cache.GetItemsByPrefix<Models.Snake>("S_").Where(s => s.FieldId == fieldId);
            foreach (var snake in fieldSnakes)
            {
                snakesPositions.AddRange(snake!.SnakePositions.Select(sp => new SnakePositionDTO
                {
                    SnakeId = snake.Id,
                    X = sp.X,
                    Y = sp.Y
                }));
            }
            return snakesPositions;
        }

    }
}
