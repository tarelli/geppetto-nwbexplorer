package org.geppetto.frontend.controllers.objects;

public class AdminUserObject {
	
	private String login;
	private String name;
	private String lastLogin;
	private int projects;
	private int experiments;
	private String storage;
	
	public String getLogin() {
		return login;
	}
	public void setLogin(String login) {
		this.login = login;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getLastLogin() {
		return lastLogin;
	}
	public void setLastLogin(String lastLogin) {
		this.lastLogin = lastLogin;
	}
	public int getProjects() {
		return projects;
	}
	public void setProjects(int projects) {
		this.projects = projects;
	}
	public int getExperiments() {
		return experiments;
	}
	public void setExperiments(int experiments) {
		this.experiments = experiments;
	}
	public String getStorage() {
		return storage;
	}
	public void setStorage(String storage) {
		this.storage = storage;
	}

}
