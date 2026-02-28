using SurveySystem.Application.DTOs;
using SurveySystem.Domain.Entities;

namespace SurveySystem.Application.Interfaces
{
    public interface IOrderService
    {
        Task AddAsync(Order order, CancellationToken cancellationToken = default);
        Task AddRangeAsync(IEnumerable<Order> orders, CancellationToken cancellationToken = default);
        Task<(IEnumerable<Order> Items, int TotalCount)> GetPagedAsync(
            OrderFilterParameters filters,
            CancellationToken cancellationToken = default);
    }
}
