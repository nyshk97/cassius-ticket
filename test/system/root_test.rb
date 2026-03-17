require "test_helper"

class RootTest < ApplicationSystemTestCase
  test "visiting the root" do
    visit root_url
    assert_selector "h1", count: 1
  end
end
