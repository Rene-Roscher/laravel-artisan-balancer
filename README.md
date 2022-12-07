# Load Balancer for Laravel Artisan (not for production!)
This load balancer script is designed to balance HTTP requests among multiple instances of a server application. 
It creates a proxy server that listens on port 5000 and forwards incoming requests to one of the instances in a round-robin fashion.

# Requirements
- Node.js

# Setup
- Clone or download this repository.
- Open a terminal and navigate to the directory where you cloned or downloaded the repository. 
- Install the dependencies by running npm install.
- Start the load balancer by running node load-balancer.js <laravel_artisan_file_path> [instances], where: <server_app_path> is the path to the artisan file of the laravel application.
- [instances] is the optional number of instances to run. The default value is 8.

# Usage
Once the load balancer is running, you can access the server application at http://localhost:5000. The load balancer will forward requests to one of the instances in a round-robin fashion.

To stop the load balancer, press CTRL+C in the terminal where it is running. This will also stop all instances of the server application.

# Example for Starting the Load Balancer

```code
node load-balancer.js C:\Users\Rene\Desktop\laravel-application\artisan 8
```