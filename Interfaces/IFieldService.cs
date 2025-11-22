using Snake.Models;
using Snake.Models.DTO;

namespace Snake.Interfaces
{
    public interface IFieldService
    {
        void CreateNewField(FieldDTO field);
        Task GenerateNewApple(Field field);
    }
}
