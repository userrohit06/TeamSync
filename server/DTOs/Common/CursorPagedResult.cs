namespace server.DTOs.Common
{
    public class CursorPagedResult<T>
    {
        public IReadOnlyList<T> Items { get; init; }
        public int PageSize { get; init; }
        public bool HasNextPage { get; init; }
        public string? NextCursor { get; init; }

        public CursorPagedResult(IReadOnlyList<T> items, int pageSize, bool hasNextPage, string? nextCursor)
        {
            Items = items;
            PageSize = pageSize;
            HasNextPage = hasNextPage;
            NextCursor = nextCursor;
        }

        /// <summary>
        /// Factory method that consumes a list with an optional probe row (+1 item), automatically determines hasNextPage, strips the extra row, generates the cursor, and returns the clean result to the client.
        /// </summary>
        public static CursorPagedResult<T> Create(List<T> rawItems, int requestedPageSize, Func<T, string> cursorSelector)
        {
            bool hasNextPage = rawItems.Count > requestedPageSize;

            // strip probe item so client never receives more than requestedPageSize
            if (hasNextPage)
            {
                rawItems.RemoveAt(rawItems.Count - 1);
            }

            string? nextCursor = null;
            if (hasNextPage && rawItems.Count > 0)
            {
                nextCursor = cursorSelector(rawItems[^1]);
            }

            return new CursorPagedResult<T>(items: rawItems, pageSize: requestedPageSize, hasNextPage: hasNextPage, nextCursor: nextCursor);
        }
    }
}
