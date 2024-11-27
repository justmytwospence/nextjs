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
    if (totalPages <= 5) {
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

      if (currentPage > 3) {
        pages.push(<PaginationEllipsis key="start-ellipsis" />);
      }

      if (currentPage > 2 && currentPage < totalPages - 1) {
        pages.push(
          <PaginationItem
            key={currentPage}
            className="active-class"
          >
            <PaginationLink
              onClick={() => handlePageChange(currentPage)}
              className="bg-blue-500 text-white cursor-pointer"
            >
              {currentPage}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(<PaginationEllipsis key="end-ellipsis" />);
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
    <div className="flex items-center space-x-2">
      <PaginationPrevious
        className={`cursor-pointer ${currentPage === 1 ? "disabled-class" : ""}`}
      >
        Previous
      </PaginationPrevious>
      <PaginationContent>{renderPageNumbers()}</PaginationContent>
      <PaginationNext
        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
        className={`cursor-pointer ${currentPage === totalPages ? "disabled-class" : ""}`}
      >
        Next
      </PaginationNext>
    </div>
  );
}