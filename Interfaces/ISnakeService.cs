using Snake.Models;

namespace Snake.Interfaces
{
    public interface ISnakeService
    {
        Models.Snake CreateSnake(string snakeName, Field field);
    }
}
