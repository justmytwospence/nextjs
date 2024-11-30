import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  handlePageChange,
}: PaginationProps) {
  const renderPageNumbers = () => {
    const pages: JSX.Element[] = [];
    const maxPagesToShow = 5;
    const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem
            key={i}
            className={i === currentPage ? "active-class" : ""}
          >
            <PaginationLink
              onClick={() => handlePageChange(i)}
              className={`${
                i === currentPage ? "bg-blue-500 text-white" : ""
              } cursor-pointer`}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      pages.push(
        <PaginationItem
          key={1}
          className={1 === currentPage ? "active-class" : ""}
        >
          <PaginationLink
            onClick={() => handlePageChange(1)}
            className={`${
              1 === currentPage ? "bg-blue-500 text-white" : ""
            } cursor-pointer`}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > halfMaxPagesToShow + 1) {
        pages.push(<PaginationEllipsis key="start-ellipsis">...</PaginationEllipsis>);
      }

      const startPage = Math.max(2, currentPage - halfMaxPagesToShow);
      const endPage = Math.min(totalPages - 1, currentPage + halfMaxPagesToShow);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <PaginationItem
            key={i}
            className={i === currentPage ? "active-class" : ""}
          >
            <PaginationLink
              onClick={() => handlePageChange(i)}
              className={`${
                i === currentPage ? "bg-blue-500 text-white" : ""
              } cursor-pointer`}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - halfMaxPagesToShow) {
        pages.push(<PaginationEllipsis key="end-ellipsis">...</PaginationEllipsis>);
      }

      pages.push(
        <PaginationItem
          key={totalPages}
          className={totalPages === currentPage ? "active-class" : ""}
        >
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            className={`${
              totalPages === currentPage ? "bg-blue-500 text-white" : ""
            } cursor-pointer`}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  return (
    <PaginationContent>
      <PaginationPrevious
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
      >
        Previous
      </PaginationPrevious>
      {renderPageNumbers()}
      <PaginationNext
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
      >
        Next
      </PaginationNext>
    </PaginationContent>
  );
}