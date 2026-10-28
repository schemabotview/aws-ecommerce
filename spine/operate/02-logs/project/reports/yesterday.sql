-- What did we sell yesterday? The five books that took the most.
SELECT book, sum(quantity) AS copies, sum(quantity * price) AS sales
FROM book_shop_lake.order_history
WHERE dt = '2026-09-30'
GROUP BY book
ORDER BY sales DESC
LIMIT 5
