using Snake.Models.DTO;

namespace Snake.Interfaces
{
    public interface ISnakePositionSerice
    {
        List<SnakePositionDTO> GetAllSnakePositions(Guid fieldId);
    }
}
