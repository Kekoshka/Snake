namespace Snake.Models
{
    public class Snake
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Orientation { get; set; }
        public ICollection<SnakePosition> SnakePositions { get; set; }
        public Field Field { get; set; }

    }
}
