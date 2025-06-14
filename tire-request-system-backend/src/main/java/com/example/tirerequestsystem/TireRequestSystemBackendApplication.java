package com.example.tirerequestsystem;

import com.example.tirerequestsystem.models.User;
import com.example.tirerequestsystem.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@SpringBootApplication
public class TireRequestSystemBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(TireRequestSystemBackendApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			// Create default admin user
			if (!userRepository.existsByUsername("admin")) {
				User admin = new User();
				admin.setUsername("admin");
				admin.setPassword(passwordEncoder.encode("adminpass"));
				admin.setEmail("admin@example.com");
				admin.setRoles(Set.of("ROLE_ADMIN", "ROLE_USER", "ROLE_MANAGER", "ROLE_TRANSPORT_OFFICER"));
				userRepository.save(admin);
				System.out.println("Created default admin user.");
			}

			// Create default manager user
			if (!userRepository.existsByUsername("manager")) {
				User manager = new User();
				manager.setUsername("manager");
				manager.setPassword(passwordEncoder.encode("managerpass"));
				manager.setEmail("manager@example.com");
				manager.setRoles(Set.of("ROLE_MANAGER", "ROLE_USER"));
				userRepository.save(manager);
				System.out.println("Created default manager user.");
			}

			// Create default transport officer user
			if (!userRepository.existsByUsername("transportofficer")) {
				User to = new User();
				to.setUsername("transportofficer");
				to.setPassword(passwordEncoder.encode("topass"));
				to.setEmail("to@example.com");
				to.setRoles(Set.of("ROLE_TRANSPORT_OFFICER", "ROLE_USER"));
				userRepository.save(to);
				System.out.println("Created default transport officer user.");
			}

			// Create default regular user
			if (!userRepository.existsByUsername("user")) {
				User regularUser = new User();
				regularUser.setUsername("user");
				regularUser.setPassword(passwordEncoder.encode("userpass"));
				regularUser.setEmail("user@example.com");
				regularUser.setRoles(Set.of("ROLE_USER"));
				userRepository.save(regularUser);
				System.out.println("Created default regular user.");
			}
		};
	}
}
