Rails.application.routes.draw do
  resource :session, only: %i[new create destroy]

  resources :events do
    member do
      patch :toggle_status
    end
    resources :orders, only: %i[show destroy], controller: "admin/orders" do
      member do
        patch :toggle_payment
        patch :toggle_delivery
      end
    end
  end

  # 会員向け公開ページ（認証不要）
  resources :events, only: [], param: :token, path: "e" do
    resources :orders, only: %i[new create show], controller: "public/orders"
  end

  get "up" => "rails/health#show", as: :rails_health_check

  root "events#index"
end
