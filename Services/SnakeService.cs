using Microsoft.Extensions.Caching.Memory;
using Snake.Enums;
using Snake.Interfaces;
using Snake.Models;
using System.Xml.Linq;

namespace Snake.Services
{
    public class SnakeService : ISnakeService
    {
        public SnakeService() 
        { }
        public Models.Snake CreateSnake(string snakeName, Field field)
        {
            var headPosition = new SnakePosition
            {
                Id = Guid.NewGuid(),
                Order = 0,
                X = Random.Shared.Next(3, field.Width - 3),
                Y = Random.Shared.Next(3, field.Height - 3)
            };
            var bodyPositionFirst = new SnakePosition
            {
                Id = Guid.NewGuid(),
                Order = 1,
                X = headPosition.X >= field.Width / 2 ? headPosition.X + 1 : headPosition.X - 1,
                Y = headPosition.Y
            };
            var bodyPositionSecond = new SnakePosition
            {
                Id = Guid.NewGuid(),
                Order = 2,
                X = headPosition.X >= field.Width / 2 ? headPosition.X + 2 : headPosition.X - 2,
                Y = headPosition.Y
            };
            var snakePositions =  new List<SnakePosition>
            {
                headPosition,
                bodyPositionFirst,
                bodyPositionSecond
            };


            var snake = new Models.Snake
            {
                Id = Guid.NewGuid(),
                Name = snakeName,
                SnakePositions = snakePositions,
                Orientation = headPosition.X >= field.Width / 2 ? SnakeOrientation.Left.GetHashCode() : SnakeOrientation.Right.GetHashCode(),
                Field = field
            };
            return snake;
        }
        public void UpdateSnake()
        {

        }
    }
}
