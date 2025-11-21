using Snake.Models;

namespace Snake.Interfaces
{
    public interface ISnakeService
    {
        Models.Snake CreateSnakeAndAddToField(string snakeName, string userIp, Field field);
    }
}
