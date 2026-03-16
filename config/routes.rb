Rails.application.routes.draw do
  resource :session, only: %i[new create destroy]

  resources :events do
    member do
      patch :toggle_status
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check

  root "events#index"
end
