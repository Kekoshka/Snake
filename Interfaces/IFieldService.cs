using Snake.Models;
using Snake.Models.DTO;

namespace Snake.Interfaces
{
    public interface IFieldService
    {
        Guid CreateNewField(FieldDTO field);
        Task GenerateNewApple(Field field);
    }
}
