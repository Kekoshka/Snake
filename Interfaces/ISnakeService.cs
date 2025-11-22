using Snake.Models;

namespace Snake.Interfaces
{
    public interface ISnakeService
    {
        Task<Models.Snake> CreateSnakeAndAddToFieldAsync(string snakeName, string userIp, Field field);
    }
}
