import { ReactNode } from "react";

import styles from "./DataTable.module.css";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;

  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;

  onRowClick?: (row: T) => void;
}

const DataTable = <T,>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyTitle = "No data found",
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) => {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>—</div>

          <h3>{emptyTitle}</h3>

          {emptyDescription && <p>{emptyDescription}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Desktop */}
      <div className={styles.desktopTable}>
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    ${getAlignClass(styles, column.align)}
                    ${column.hideOnMobile ? styles.hideOnMobile : ""}
                  `}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? styles.clickableRow : ""}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      ${getAlignClass(styles, column.align)}
                      ${column.hideOnMobile ? styles.hideOnMobile : ""}
                    `}
                  >
                    {column.render
                      ? column.render(row)
                      : column.accessor
                        ? String(row[column.accessor] ?? "")
                        : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className={styles.mobileCards}>
        {data.map((row) => (
          <div
            key={rowKey(row)}
            className={styles.mobileCard}
            onClick={() => onRowClick?.(row)}
          >
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div key={column.key} className={styles.mobileRow}>
                  <span className={styles.mobileLabel}>{column.header}</span>

                  <div className={styles.mobileValue}>
                    {column.render
                      ? column.render(row)
                      : column.accessor
                        ? String(row[column.accessor] ?? "")
                        : null}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const getAlignClass = (
  stylesObject: typeof styles,
  align?: "left" | "center" | "right",
) => {
  if (align === "center") {
    return stylesObject.center;
  }

  if (align === "right") {
    return stylesObject.right;
  }

  return stylesObject.left;
};

export default DataTable;
