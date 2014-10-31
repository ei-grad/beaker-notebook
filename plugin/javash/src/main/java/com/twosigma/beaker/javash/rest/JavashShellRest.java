/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.twosigma.beaker.javash.rest;

import com.google.inject.Singleton;
import com.twosigma.beaker.jvm.object.SimpleEvaluationObject;
import com.twosigma.beaker.javash.utils.JavaShell;
//import groovy.lang.Binding;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.lang.reflect.Constructor;
//import org.codehaus.groovy.control.CompilerConfiguration;
//import org.codehaus.groovy.control.CompilationFailedException;
//import org.codehaus.groovy.control.customizers.ImportCustomizer;

@Path("javash")
@Produces(MediaType.APPLICATION_JSON)
@Singleton
public class JavashShellRest {

  private final Map<String, JavaShell> shells = new HashMap<>();
  //private final Map<String, String> classPaths = new HashMap<>();
  //private final Map<String, String> imports = new HashMap<>();

  public JavashShellRest() throws IOException {}

  @POST
  @Path("getShell")
  @Produces(MediaType.TEXT_PLAIN)
  public String getShell(@FormParam("shellId") String shellId) 
    throws InterruptedException, MalformedURLException
  {
    // if the shell doesnot already exist, create a new shell
    if (shellId.isEmpty() || !this.shells.containsKey(shellId)) {
      shellId = UUID.randomUUID().toString();
      JavaShell js = new JavaShell(shellId);
      this.shells.put(shellId, js);
      return shellId;
    }
    return shellId;
  }

  @POST
  @Path("evaluate")
  public SimpleEvaluationObject evaluate(
      @FormParam("shellId") String shellId,
      @FormParam("code") String code) throws InterruptedException {

    SimpleEvaluationObject obj = new SimpleEvaluationObject(code);
    obj.started();
    if(!this.shells.containsKey(shellId)) {
      obj.error("Cannot find shell");
      return obj;
    }
    try {
      this.shells.get(shellId).evaluate(obj, code);
    } catch (Exception e) {
      obj.error(e.toString());
      return obj;
    }
    return obj;
  }

  @POST
  @Path("autocomplete")
  public List<String> autocomplete(
      @FormParam("shellId") String shellId,
      @FormParam("code") String code,
      @FormParam("caretPosition") int caretPosition) throws InterruptedException {
    if(!this.shells.containsKey(shellId)) {
      return null;
    }
    return this.shells.get(shellId).autocomplete(code, caretPosition);
  }

  @POST
  @Path("exit")
  public void exit(@FormParam("shellId") String shellId) {
    if(!this.shells.containsKey(shellId)) {
      return;
    }
    this.shells.get(shellId).exit();
    this.shells.remove(shellId);
  }

  @POST
  @Path("cancelExecution")
  public void cancelExecution(@FormParam("shellId") String shellId) {
    if(!this.shells.containsKey(shellId)) {
      return;
    }
    this.shells.get(shellId).cancelExecution();
  }

  @POST
  @Path("killAllThreads")
  public void killAllThreads(@FormParam("shellId") String shellId) {
    if(!this.shells.containsKey(shellId)) {
      return;
    }
    this.shells.get(shellId).killAllThreads();
  }

  @POST
  @Path("resetEnvironment")
  public void resetEnvironment(@FormParam("shellId") String shellId) {
    System.err.println("reset on "+shellId);
  }

  @POST
  @Path("setShellOptions")
  public void setShellOptions(
      @FormParam("shellId") String shellId,
      @FormParam("classPath") String classPath,
      @FormParam("imports") String imports,
      @FormParam("outdir") String outDir)
    throws MalformedURLException, IOException
  {
    if(!this.shells.containsKey(shellId)) {
      return;
    }
    this.shells.get(shellId).setShellOptions(classPath, imports, outDir);
  }

}
