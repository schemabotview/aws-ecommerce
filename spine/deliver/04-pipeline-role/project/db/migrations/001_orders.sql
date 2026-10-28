-- The orders schema. Stock can never go below zero: the database refuses.
CREATE TABLE books (
  id    text PRIMARY KEY,
  title text NOT NULL,
  price numeric(8, 2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL CHECK (stock >= 0)
);

CREATE TABLE orders (
  id       serial PRIMARY KEY,
  customer text NOT NULL,
  total    numeric(10, 2) NOT NULL
);

CREATE TABLE order_lines (
  order_id integer NOT NULL REFERENCES orders,
  book_id  text NOT NULL REFERENCES books,
  quantity integer NOT NULL CHECK (quantity > 0),
  price    numeric(8, 2) NOT NULL,
  PRIMARY KEY (order_id, book_id)
);

INSERT INTO books VALUES
  ('bk-1001', 'Night Trains of Europe', 10.99, 40),
  ('bk-1002', 'A Field Guide to Rain', 8.50, 1);
