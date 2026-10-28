import pytest

from book_shop import catalog


def test_reads_a_book(aws):
    assert catalog.get_book("bk-1001")["title"] == "Night Trains of Europe"


def test_a_missing_book_is_not_found(aws):
    with pytest.raises(catalog.NotFound):
        catalog.get_book("bk-9999")
