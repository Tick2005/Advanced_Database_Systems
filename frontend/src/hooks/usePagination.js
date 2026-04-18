import { useState } from 'react';
const usePagination = (initialPage = 1, initialSize = 10) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  const reset = () => setPage(1);
  return { page, pageSize, setPage, setPageSize, reset };
};
export default usePagination;